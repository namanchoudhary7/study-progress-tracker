import { useState } from "react";
import { CircleDot, ListTodo, X } from "lucide-react";
import { useSubjects } from "../hooks/useSubjects";
import { useTopics } from "../hooks/useTopics";
import { useTimer } from "../context/TimerContext";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";

export function TaskPickerModal({ onClose }: { onClose: () => void }) {
  const { data: subjects } = useSubjects();
  const { data: topics, isLoading } = useTopics();
  const { start } = useTimer();
  const [pomodoroOn, setPomodoroOn] = useState(false);
  const [workMinutes, setWorkMinutes] = useState("25");
  const [breakMinutes, setBreakMinutes] = useState("5");

  const pending = (topics ?? []).filter((t) => t.status === "todo" || t.status === "in_progress");
  const subjectName = (id: number) => subjects?.find((s) => s.id === id)?.name ?? "—";

  function handlePick(topicId: number, topicName: string, subjectId: number) {
    start(
      { subjectId, subjectName: subjectName(subjectId), topicId, topicName },
      pomodoroOn
        ? { workMinutes: Number(workMinutes) || 25, breakMinutes: Number(breakMinutes) || 5 }
        : undefined
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
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
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <CircleDot
                className={`h-3.5 w-3.5 shrink-0 ${
                  topic.status === "in_progress" ? "text-blue-600 dark:text-blue-400" : "text-neutral-400"
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

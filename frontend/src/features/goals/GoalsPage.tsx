import { useState } from "react";
import { Target } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { GoalStatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useCreateGoal, useGoals, useUpdateGoal } from "../../hooks/useGoals";
import type { Goal } from "../../api/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(goal: Goal) {
  return goal.status === "open" && goal.target_date < todayISO();
}

export function GoalsPage() {
  const { data: goals, isLoading, isError, error, refetch } = useGoals();
  const { data: subjects } = useSubjects();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [targetType, setTargetType] = useState<"subject" | "topic">("subject");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState(todayISO());

  const { data: topics } = useTopics(subjectId === "" ? undefined : subjectId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (targetType === "subject" && subjectId === "") return;
    if (targetType === "topic" && topicId === "") return;

    createGoal.mutate(
      {
        title,
        target_date: targetDate,
        subject_id: targetType === "subject" ? (subjectId as number) : null,
        topic_id: targetType === "topic" ? (topicId as number) : null,
      },
      { onSuccess: () => { setTitle(""); } }
    );
  }

  const overdue = goals?.filter(isOverdue) ?? [];
  const open = goals?.filter((g) => g.status === "open" && !isOverdue(g)) ?? [];
  const completed = goals?.filter((g) => g.status !== "open") ?? [];

  function GoalRow({ goal }: { goal: Goal }) {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium">{goal.title}</p>
          <p className="text-sm text-neutral-500">Due {goal.target_date}</p>
        </div>
        <div className="flex items-center gap-2">
          <GoalStatusBadge status={isOverdue(goal) ? "missed" : goal.status} />
          {goal.status === "open" && (
            <Button size="sm" onClick={() => updateGoal.mutate({ id: goal.id, data: { status: "completed" } })}>
              Mark complete
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value as "subject" | "topic"); setSubjectId(""); setTopicId(""); }}
          >
            <option value="subject">Whole subject</option>
            <option value="topic">Specific topic</option>
          </Select>
          <Select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : ""); setTopicId(""); }}
          >
            <option value="">Subject…</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          {targetType === "topic" && (
            <Select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
              disabled={!subjectId}
            >
              <option value="">Topic…</option>
              {topics?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          )}
          <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          <Button
            type="submit"
            variant="primary"
            className="col-span-2 sm:col-span-5"
            disabled={createGoal.isPending}
          >
            Add goal
          </Button>
        </form>
      </Card>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}

      {!isError && overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-red-600 dark:text-red-400">Overdue</h2>
          {overdue.map((g) => <GoalRow key={g.id} goal={g} />)}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Open</h2>
        {open.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-neutral-500">
            <Target className="h-6 w-6 text-neutral-300 dark:text-neutral-700" />
            No open goals.
          </div>
        )}
        {open.map((g) => <GoalRow key={g.id} goal={g} />)}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Completed</h2>
        {completed.length === 0 && <p className="text-sm text-neutral-500">No completed goals yet.</p>}
        {completed.map((g) => <GoalRow key={g.id} goal={g} />)}
      </div>
    </div>
  );
}

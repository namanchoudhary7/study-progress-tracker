import { useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Select } from "../../components/ui/Select";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useCreatePlan, useDeletePlan, usePlans } from "../../hooks/usePlans";
import type { RecurringPlan } from "../../api/types";

const DAYS = [
  { bit: 1, label: "Mon" },
  { bit: 2, label: "Tue" },
  { bit: 4, label: "Wed" },
  { bit: 8, label: "Thu" },
  { bit: 16, label: "Fri" },
  { bit: 32, label: "Sat" },
  { bit: 64, label: "Sun" },
];

export function PlansPage() {
  const { data: plans, isLoading, isError, error, refetch } = usePlans();
  const { data: subjects } = useSubjects();
  const createPlan = useCreatePlan();
  const deletePlan = useDeletePlan();

  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [daysMask, setDaysMask] = useState(0);

  const { data: formTopics } = useTopics(subjectId === "" ? undefined : subjectId);
  const { data: allTopics } = useTopics();

  function toggleDay(bit: number) {
    setDaysMask((mask) => (mask & bit ? mask & ~bit : mask | bit));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subjectId === "" || daysMask === 0) return;
    createPlan.mutate(
      { subject_id: subjectId as number, topic_id: topicId === "" ? null : topicId, days_of_week: daysMask },
      { onSuccess: () => { setSubjectId(""); setTopicId(""); setDaysMask(0); } }
    );
  }

  function subjectName(id: number) {
    return subjects?.find((s) => s.id === id)?.name ?? "—";
  }

  function topicName(plan: RecurringPlan) {
    if (plan.topic_id === null) return null;
    return allTopics?.find((t) => t.id === plan.topic_id)?.name ?? null;
  }

  function daysLabel(mask: number) {
    return DAYS.filter((d) => mask & d.bit).map((d) => d.label).join(", ");
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        Set up a weekly rhythm — e.g. "Physics on Mon/Wed/Fri" — and it'll show up pinned at the top of the timer's
        task picker on those days.
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select
              value={subjectId}
              onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : ""); setTopicId(""); }}
            >
              <option value="">Subject…</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
              disabled={!subjectId}
            >
              <option value="">Whole subject (any topic)</option>
              {formTopics?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.bit}
                type="button"
                onClick={() => toggleDay(d.bit)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  daysMask & d.bit
                    ? "bg-blue-600 text-white"
                    : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <Button type="submit" variant="primary" disabled={createPlan.isPending || subjectId === "" || daysMask === 0}>
            Add plan
          </Button>
        </form>
      </Card>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && plans?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
          <CalendarDays className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          No recurring plans yet — add one above.
        </div>
      )}

      <div className="space-y-2">
        {plans?.map((plan) => (
          <Card key={plan.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {subjectName(plan.subject_id)}
                {topicName(plan) && <span className="text-neutral-500"> · {topicName(plan)}</span>}
              </p>
              <p className="text-sm text-neutral-500">{daysLabel(plan.days_of_week)}</p>
            </div>
            <IconButton
              icon={Trash2}
              label="Delete plan"
              variant="danger"
              onClick={() => deletePlan.mutate(plan.id)}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

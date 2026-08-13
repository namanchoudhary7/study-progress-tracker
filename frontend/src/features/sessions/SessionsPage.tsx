import { useState } from "react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useCreateSession, useSessions } from "../../hooks/useSessions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function SessionsPage() {
  const { data: subjects } = useSubjects();
  const { data: sessions, isLoading, isError, error, refetch } = useSessions();
  const createSession = useCreateSession();

  const [subjectId, setSubjectId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [date, setDate] = useState(todayISO());
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const { data: topics } = useTopics(subjectId === "" ? undefined : subjectId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subjectId === "" || !minutes) return;
    createSession.mutate(
      {
        subject_id: subjectId,
        topic_id: topicId === "" ? null : topicId,
        session_date: date,
        duration_minutes: Number(minutes),
        notes: notes || null,
      },
      { onSuccess: () => { setMinutes(""); setNotes(""); } }
    );
  }

  const subjectName = (id: number) => subjects?.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Log a study session</h1>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <select
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : ""); setTopicId(""); }}
          >
            <option value="">Subject…</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
            disabled={!subjectId}
          >
            <option value="">Topic (optional)…</option>
            {topics?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="number"
            min="1"
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <input
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="submit"
            className="col-span-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 sm:col-span-5"
            disabled={createSession.isPending}
          >
            Log session
          </button>
        </form>
      </Card>

      <h2 className="text-lg font-medium">Recent sessions</h2>
      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && sessions?.length === 0 && <p className="text-sm text-neutral-500">No sessions logged yet.</p>}
      <div className="space-y-2">
        {sessions?.map((s) => (
          <Card key={s.id} className="flex items-center justify-between text-sm">
            <span>{s.session_date} · {subjectName(s.subject_id)}</span>
            <span className="text-neutral-500">{s.duration_minutes} min</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

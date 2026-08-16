import { useState } from "react";
import { History } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { TimerWidget } from "../../components/TimerWidget";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useCreateSession, useSessions, useUpdateSession } from "../../hooks/useSessions";
import type { StudySession } from "../../api/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function SessionRow({ session, subjectName }: { session: StudySession; subjectName: string }) {
  const updateSession = useUpdateSession();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? "");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSession.mutate({ id: session.id, data: { notes: notes || null } }, { onSuccess: () => setEditing(false) });
  }

  return (
    <Card className="text-sm">
      <div className="flex items-center justify-between">
        <span>{session.session_date} · {subjectName}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-neutral-500">{session.duration_minutes} min</span>
          <Button size="sm" onClick={() => setEditing((e) => !e)}>
            {editing ? "Close" : session.notes ? "Edit note" : "Add note"}
          </Button>
        </div>
      </div>
      {editing ? (
        <form onSubmit={handleSave} className="mt-2 flex gap-2">
          <Input className="flex-1" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button type="submit" variant="primary" size="sm">
            Save
          </Button>
        </form>
      ) : (
        session.notes && <p className="mt-1 text-neutral-500">{session.notes}</p>
      )}
    </Card>
  );
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
      <TimerWidget />

      <Card>
        <h2 className="mb-3 font-mono-label text-neutral-500 dark:text-neutral-400">Log a session manually</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
            <option value="">Topic (optional)…</option>
            {topics?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            type="number"
            min="1"
            placeholder="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button
            type="submit"
            variant="primary"
            className="col-span-2 sm:col-span-5"
            disabled={createSession.isPending}
          >
            Log session
          </Button>
        </form>
      </Card>

      <h2 className="text-lg font-medium">Recent sessions</h2>
      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && sessions?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
          <History className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          No sessions logged yet.
        </div>
      )}
      <div className="space-y-2">
        {sessions?.map((s) => (
          <SessionRow key={s.id} session={s} subjectName={subjectName(s.subject_id)} />
        ))}
      </div>
    </div>
  );
}

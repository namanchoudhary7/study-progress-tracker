import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useCreateSubject, useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";

function SubjectRow({ subjectId, name, description }: { subjectId: number; name: string; description: string | null }) {
  const { data: topics } = useTopics(subjectId);
  const total = topics?.length ?? 0;
  const done = topics?.filter((t) => t.status === "done").length ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/subjects/${subjectId}`} className="font-medium hover:underline">
            {name}
          </Link>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
        <span className="text-sm text-neutral-500">
          {done}/{total} topics ({pct}%)
        </span>
      </div>
    </Card>
  );
}

export function SubjectsPage() {
  const { data: subjects, isLoading, isError, error, refetch } = useSubjects();
  const createSubject = useCreateSubject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createSubject.mutate(
      { name, description: description || null },
      { onSuccess: () => { setName(""); setDescription(""); } }
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Subjects</h1>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Subject name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          disabled={createSubject.isPending}
        >
          Add subject
        </button>
      </form>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && subjects?.length === 0 && (
        <p className="text-sm text-neutral-500">No subjects yet — add one above to get started.</p>
      )}
      <div className="space-y-3">
        {subjects?.map((s) => (
          <SubjectRow key={s.id} subjectId={s.id} name={s.name} description={s.description} />
        ))}
      </div>
    </div>
  );
}

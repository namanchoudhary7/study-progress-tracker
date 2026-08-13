import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useCreateSubject, useDeleteSubject, useSubjects, useUpdateSubject } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import type { Subject } from "../../api/types";

const DEFAULT_COLOR = "#2a78d6";

function SubjectRow({ subject }: { subject: Subject }) {
  const { data: topics } = useTopics(subject.id);
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [description, setDescription] = useState(subject.description ?? "");
  const [color, setColor] = useState(subject.color ?? DEFAULT_COLOR);

  const total = topics?.length ?? 0;
  const done = topics?.filter((t) => t.status === "done").length ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSubject.mutate(
      { id: subject.id, data: { name, description: description || null, color } },
      { onSuccess: () => setEditing(false) }
    );
  }

  function handleDelete() {
    if (window.confirm(`Delete "${subject.name}" and all its topics? This cannot be undone.`)) {
      deleteSubject.mutate(subject.id);
    }
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
          />
          <input
            className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
            Cancel
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: subject.color ?? DEFAULT_COLOR }}
          />
          <div>
            <Link to={`/subjects/${subject.id}`} className="font-medium hover:underline">
              {subject.name}
            </Link>
            {subject.description && <p className="text-sm text-neutral-500">{subject.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            {done}/{total} topics ({pct}%)
          </span>
          <button onClick={() => setEditing(true)} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
            Edit
          </button>
          <button onClick={handleDelete} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40">
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}

export function SubjectsPage() {
  const { data: subjects, isLoading, isError, error, refetch } = useSubjects();
  const createSubject = useCreateSubject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createSubject.mutate(
      { name, description: description || null, color },
      { onSuccess: () => { setName(""); setDescription(""); setColor(DEFAULT_COLOR); } }
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Subjects</h1>

      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
          title="Subject color"
        />
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
        {subjects?.map((s) => <SubjectRow key={s.id} subject={s} />)}
      </div>
    </div>
  );
}

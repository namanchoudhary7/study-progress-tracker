import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useToast } from "../../components/Toast";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { subjectsKey, useCreateSubject, useDeleteSubject, useSubjects, useUpdateSubject } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import type { Subject } from "../../api/types";

const DEFAULT_COLOR = "#2a78d6";

function SubjectRow({ subject }: { subject: Subject }) {
  const qc = useQueryClient();
  const { showUndoToast } = useToast();
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
    qc.setQueryData<Subject[]>(subjectsKey, (old) => old?.filter((s) => s.id !== subject.id));
    showUndoToast({
      message: `Deleted "${subject.name}" and all its topics`,
      onUndo: () => qc.invalidateQueries({ queryKey: subjectsKey }),
      onExpire: () => deleteSubject.mutate(subject.id),
    });
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
          />
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            className="flex-1"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" variant="primary" size="sm">
            Save
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
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
          <IconButton icon={Pencil} label="Edit subject" onClick={() => setEditing(true)} />
          <IconButton icon={Trash2} label="Delete subject" variant="danger" onClick={handleDelete} />
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
      <Card>
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
            title="Subject color"
          />
          <Input placeholder="Subject name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={createSubject.isPending}>
            Add subject
          </Button>
        </form>
      </Card>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && subjects?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
          <BookOpen className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          No subjects yet — add one above to get started.
        </div>
      )}
      <div className="space-y-3">
        {subjects?.map((s) => <SubjectRow key={s.id} subject={s} />)}
      </div>
    </div>
  );
}

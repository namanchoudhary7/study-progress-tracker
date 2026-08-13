import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { TopicStatusBadge } from "../../components/StatusBadge";
import { useSubjects } from "../../hooks/useSubjects";
import { useBulkCreateTopics, useCreateTopic, useDeleteTopic, useTopics, useUpdateTopic } from "../../hooks/useTopics";
import type { Topic, TopicStatus } from "../../api/types";

const STATUS_OPTIONS: TopicStatus[] = ["todo", "in_progress", "done"];

function TopicRow({ topic }: { topic: Topic }) {
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(topic.name);
  const [notes, setNotes] = useState(topic.notes ?? "");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateTopic.mutate({ id: topic.id, data: { name, notes: notes || null } }, { onSuccess: () => setEditing(false) });
  }

  function handleDelete() {
    if (window.confirm(`Delete "${topic.name}"? This cannot be undone.`)) {
      deleteTopic.mutate(topic.id);
    }
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <input
            className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-medium">{topic.name}</p>
        {topic.notes && <p className="text-sm text-neutral-500">{topic.notes}</p>}
      </div>
      <div className="flex items-center gap-2">
        <TopicStatusBadge status={topic.status} />
        <select
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
          value={topic.status}
          onChange={(e) => updateTopic.mutate({ id: topic.id, data: { status: e.target.value as TopicStatus } })}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button onClick={() => setEditing(true)} className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
          Edit
        </button>
        <button onClick={handleDelete} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40">
          Delete
        </button>
      </div>
    </Card>
  );
}

export function SubjectDetailPage() {
  const { id } = useParams();
  const subjectId = Number(id);
  const { data: subjects } = useSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);
  const { data: topics, isLoading } = useTopics(subjectId);
  const createTopic = useCreateTopic();
  const bulkCreateTopics = useBulkCreateTopics();
  const [name, setName] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createTopic.mutate({ subject_id: subjectId, name }, { onSuccess: () => setName("") });
  }

  function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkText.trim()) return;
    bulkCreateTopics.mutate(
      { subjectId, text: bulkText },
      { onSuccess: () => { setBulkText(""); setBulkOpen(false); } }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: subject?.color ?? "#2a78d6" }}
        />
        <div>
          <h1 className="text-xl font-semibold">{subject?.name ?? "Subject"}</h1>
          {subject?.description && <p className="text-sm text-neutral-500">{subject.description}</p>}
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="New topic name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          disabled={createTopic.isPending}
        >
          Add topic
        </button>
        <button
          type="button"
          onClick={() => setBulkOpen((o) => !o)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Bulk add
        </button>
      </form>

      {bulkOpen && (
        <Card>
          <form onSubmit={handleBulkCreate} className="space-y-2">
            <label className="block text-sm text-neutral-500">
              One topic per line — paste a syllabus or table of contents
            </label>
            <textarea
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              rows={6}
              placeholder={"Introduction\nChapter 1: Basics\nChapter 2: Advanced Topics"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                disabled={bulkCreateTopics.isPending}
              >
                Add topics
              </button>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && topics?.length === 0 && (
        <p className="text-sm text-neutral-500">No topics yet — add one above.</p>
      )}
      <div className="space-y-2">
        {topics?.map((topic) => <TopicRow key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

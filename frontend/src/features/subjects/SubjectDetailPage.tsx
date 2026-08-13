import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ListChecks, Pencil, Trash2 } from "lucide-react";
import { Card } from "../../components/Card";
import { TopicStatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/Toast";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { useSubjects } from "../../hooks/useSubjects";
import {
  topicsKey,
  useBulkCreateTopics,
  useCreateTopic,
  useDeleteTopic,
  useTopics,
  useUpdateTopic,
} from "../../hooks/useTopics";
import type { Topic, TopicStatus } from "../../api/types";

const STATUS_OPTIONS: TopicStatus[] = ["todo", "in_progress", "done"];

function TopicRow({ topic }: { topic: Topic }) {
  const qc = useQueryClient();
  const { showUndoToast } = useToast();
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
    const key = topicsKey(topic.subject_id);
    qc.setQueryData<Topic[]>(key, (old) => old?.filter((t) => t.id !== topic.id));
    showUndoToast({
      message: `Deleted "${topic.name}"`,
      onUndo: () => qc.invalidateQueries({ queryKey: key }),
      onExpire: () => deleteTopic.mutate(topic.id),
    });
  }

  if (editing) {
    return (
      <Card>
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input className="flex-1" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-medium">{topic.name}</p>
        {topic.notes && <p className="text-sm text-neutral-500">{topic.notes}</p>}
      </div>
      <div className="flex items-center gap-2">
        <TopicStatusBadge status={topic.status} />
        <Select
          className="py-1 text-xs"
          value={topic.status}
          onChange={(e) => updateTopic.mutate({ id: topic.id, data: { status: e.target.value as TopicStatus } })}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
        <IconButton icon={Pencil} label="Edit topic" onClick={() => setEditing(true)} />
        <IconButton icon={Trash2} label="Delete topic" variant="danger" onClick={handleDelete} />
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

      <Card>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input placeholder="New topic name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" variant="primary" disabled={createTopic.isPending}>
            Add topic
          </Button>
          <Button type="button" variant="secondary" onClick={() => setBulkOpen((o) => !o)}>
            Bulk add
          </Button>
        </form>

        {bulkOpen && (
          <form onSubmit={handleBulkCreate} className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <label className="block text-sm text-neutral-500">
              One topic per line — paste a syllabus or table of contents
            </label>
            <Textarea
              className="w-full"
              rows={6}
              placeholder={"Introduction\nChapter 1: Basics\nChapter 2: Advanced Topics"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={bulkCreateTopics.isPending}>
                Add topics
              </Button>
              <Button type="button" variant="secondary" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && topics?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
          <ListChecks className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          No topics yet — add one above.
        </div>
      )}
      <div className="space-y-2">
        {topics?.map((topic) => <TopicRow key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

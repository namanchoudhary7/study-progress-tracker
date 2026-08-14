import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, ListChecks, Pencil, Tag as TagIcon, Trash2 } from "lucide-react";
import { Card } from "../../components/Card";
import { ResourceModal } from "../../components/ResourceModal";
import { TopicStatusBadge } from "../../components/StatusBadge";
import { TagPickerModal } from "../../components/TagPickerModal";
import { useToast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { useSubjects } from "../../hooks/useSubjects";
import { useTags } from "../../hooks/useTags";
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
const DEFAULT_TAG_COLOR = "#2a78d6";

function TopicRow({ topic }: { topic: Topic }) {
  const qc = useQueryClient();
  const { showUndoToast } = useToast();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const [editing, setEditing] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
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
        {topic.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {topic.tags.map((tag) => (
              <Badge key={tag.id} style={{ backgroundColor: tag.color ?? DEFAULT_TAG_COLOR, color: "#fff" }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
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
        <IconButton icon={TagIcon} label="Manage tags" onClick={() => setTagPickerOpen(true)} />
        <IconButton icon={BookOpen} label="Manage resources" onClick={() => setResourcesOpen(true)} />
        <IconButton icon={Pencil} label="Edit topic" onClick={() => setEditing(true)} />
        <IconButton icon={Trash2} label="Delete topic" variant="danger" onClick={handleDelete} />
      </div>
      {tagPickerOpen && <TagPickerModal topic={topic} onClose={() => setTagPickerOpen(false)} />}
      {resourcesOpen && <ResourceModal topic={topic} onClose={() => setResourcesOpen(false)} />}
    </Card>
  );
}

export function SubjectDetailPage() {
  const { id } = useParams();
  const subjectId = Number(id);
  const { data: subjects } = useSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);
  const { data: topics, isLoading } = useTopics(subjectId);
  const { data: tags } = useTags();
  const createTopic = useCreateTopic();
  const bulkCreateTopics = useBulkCreateTopics();
  const [name, setName] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);

  function toggleFilterTag(tagId: number) {
    setFilterTagIds((ids) => (ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId]));
  }

  const visibleTopics =
    filterTagIds.length === 0 ? topics : topics?.filter((t) => t.tags.some((tag) => filterTagIds.includes(tag.id)));

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

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500">Filter by tag:</span>
          {tags.map((tag) => {
            const active = filterTagIds.includes(tag.id);
            const color = tag.color ?? "#2a78d6";
            return (
              <button
                key={tag.id}
                onClick={() => toggleFilterTag(tag.id)}
                className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                style={active ? { backgroundColor: color, color: "#fff" } : { boxShadow: `inset 0 0 0 1px ${color}`, color }}
              >
                {tag.name}
              </button>
            );
          })}
          {filterTagIds.length > 0 && (
            <button
              onClick={() => setFilterTagIds([])}
              className="text-xs text-neutral-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && topics?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-neutral-500">
          <ListChecks className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
          No topics yet — add one above.
        </div>
      )}
      {!isLoading && topics && topics.length > 0 && visibleTopics?.length === 0 && (
        <p className="text-sm text-neutral-500">No topics match the selected tags.</p>
      )}
      <div className="space-y-2">
        {visibleTopics?.map((topic) => <TopicRow key={topic.id} topic={topic} />)}
      </div>
    </div>
  );
}

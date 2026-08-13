import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { TopicStatusBadge } from "../../components/StatusBadge";
import { useSubjects } from "../../hooks/useSubjects";
import { useCreateTopic, useTopics, useUpdateTopic } from "../../hooks/useTopics";
import type { TopicStatus } from "../../api/types";

const STATUS_OPTIONS: TopicStatus[] = ["todo", "in_progress", "done"];

export function SubjectDetailPage() {
  const { id } = useParams();
  const subjectId = Number(id);
  const { data: subjects } = useSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);
  const { data: topics, isLoading } = useTopics(subjectId);
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const [name, setName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createTopic.mutate({ subject_id: subjectId, name }, { onSuccess: () => setName("") });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{subject?.name ?? "Subject"}</h1>
        {subject?.description && <p className="text-sm text-neutral-500">{subject.description}</p>}
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
      </form>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && topics?.length === 0 && (
        <p className="text-sm text-neutral-500">No topics yet — add one above.</p>
      )}
      <div className="space-y-2">
        {topics?.map((topic) => (
          <Card key={topic.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{topic.name}</p>
              {topic.notes && <p className="text-sm text-neutral-500">{topic.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <TopicStatusBadge status={topic.status} />
              <select
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                value={topic.status}
                onChange={(e) =>
                  updateTopic.mutate({ id: topic.id, data: { status: e.target.value as TopicStatus } })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

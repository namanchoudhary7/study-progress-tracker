import { useState } from "react";
import { X } from "lucide-react";
import { ErrorBanner } from "./ErrorBanner";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { useCreateTag, useTags } from "../hooks/useTags";
import { useUpdateTopic } from "../hooks/useTopics";
import type { Topic } from "../api/types";

const DEFAULT_TAG_COLOR = "#2a78d6";

export function TagPickerModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const updateTopic = useUpdateTopic();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLOR);

  const selectedIds = new Set(topic.tags.map((t) => t.id));

  function toggle(tagId: number) {
    const next = selectedIds.has(tagId)
      ? topic.tags.filter((t) => t.id !== tagId).map((t) => t.id)
      : [...topic.tags.map((t) => t.id), tagId];
    updateTopic.mutate({ id: topic.id, data: { tag_ids: next } });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagName.trim().toLowerCase();
    if (!name) return;
    createTag.mutate(
      { name, color: newTagColor },
      {
        onSuccess: (tag) => {
          setNewTagName("");
          updateTopic.mutate({ id: topic.id, data: { tag_ids: [...topic.tags.map((t) => t.id), tag.id] } });
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Tags for "{topic.name}"</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {tags?.length === 0 && <p className="text-sm text-neutral-500">No tags yet — create one below.</p>}
          {tags?.map((tag) => {
            const active = selectedIds.has(tag.id);
            const color = tag.color ?? DEFAULT_TAG_COLOR;
            return (
              <button
                key={tag.id}
                onClick={() => toggle(tag.id)}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: color, color: "#fff" }
                    : { boxShadow: `inset 0 0 0 1px ${color}`, color }
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        {createTag.error && <div className="mb-2"><ErrorBanner message={createTag.error.message} /></div>}
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
        >
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-700"
            title="Tag color"
          />
          <Input
            className="flex-1"
            placeholder="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <Button type="submit" size="sm" variant="primary" disabled={createTag.isPending}>
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}

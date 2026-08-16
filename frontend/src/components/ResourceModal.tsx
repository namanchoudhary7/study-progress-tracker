import { useState } from "react";
import { ExternalLink, FileText, Link2, Trash2, X } from "lucide-react";
import { ErrorBanner } from "./ErrorBanner";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { useCreateResource, useDeleteResource, useResources } from "../hooks/useResources";
import type { ResourceType, Topic } from "../api/types";

export function ResourceModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const { data: resources, isLoading } = useResources(topic.id);
  const createResource = useCreateResource(topic.id);
  const deleteResource = useDeleteResource(topic.id);
  const [type, setType] = useState<ResourceType>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createResource.mutate(
      { type, title, url: type === "link" ? url : undefined, content: type === "note" ? content : undefined },
      { onSuccess: () => { setTitle(""); setUrl(""); setContent(""); } }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Resources for "{topic.name}"</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {!isLoading && resources?.length === 0 && (
          <p className="mb-3 text-sm text-neutral-500">No resources yet — add one below.</p>
        )}
        <div className="mb-3 max-h-60 space-y-2 overflow-y-auto">
          {resources?.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 p-2 text-sm dark:border-neutral-800"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium">
                  {r.type === "link" ? (
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  )}
                  {r.type === "link" ? (
                    <a
                      href={r.url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-1 truncate text-accent-600 hover:underline dark:text-accent-400"
                    >
                      <span className="truncate">{r.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="truncate">{r.title}</span>
                  )}
                </div>
                {r.type === "note" && r.content && (
                  <p className="mt-0.5 whitespace-pre-wrap text-neutral-500">{r.content}</p>
                )}
              </div>
              <IconButton
                icon={Trash2}
                label="Delete resource"
                variant="danger"
                onClick={() => deleteResource.mutate(r.id)}
              />
            </div>
          ))}
        </div>

        {createResource.error && <div className="mb-2"><ErrorBanner message={createResource.error.message} /></div>}
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={type === "link" ? "primary" : "secondary"}
              onClick={() => setType("link")}
            >
              Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant={type === "note" ? "primary" : "secondary"}
              onClick={() => setType("note")}
            >
              Note
            </Button>
          </div>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
          {type === "link" ? (
            <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="w-full" />
          ) : (
            <Textarea
              placeholder="Note content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full"
              rows={3}
            />
          )}
          <Button type="submit" variant="primary" size="sm" disabled={createResource.isPending}>
            Add resource
          </Button>
        </form>
      </div>
    </div>
  );
}

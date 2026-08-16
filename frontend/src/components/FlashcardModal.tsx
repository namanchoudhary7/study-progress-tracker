import { useState } from "react";
import { Layers, Trash2, X } from "lucide-react";
import { ErrorBanner } from "./ErrorBanner";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { Textarea } from "./ui/Textarea";
import { useCreateFlashcard, useDeleteFlashcard, useFlashcards } from "../hooks/useFlashcards";
import type { Topic } from "../api/types";

export function FlashcardModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const { data: flashcards, isLoading } = useFlashcards(topic.id);
  const createFlashcard = useCreateFlashcard(topic.id);
  const deleteFlashcard = useDeleteFlashcard(topic.id);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  function toggleReveal(id: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    createFlashcard.mutate(
      { question, answer },
      { onSuccess: () => { setQuestion(""); setAnswer(""); } }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-md before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Flashcards for "{topic.name}"</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>

        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {!isLoading && flashcards?.length === 0 && (
          <p className="mb-3 text-sm text-neutral-500">
            No flashcards yet — add one below, or ask your study coach to generate some for this topic.
          </p>
        )}
        <div className="mb-3 max-h-60 space-y-2 overflow-y-auto">
          {flashcards?.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-2 rounded-md border border-neutral-200 p-2 text-sm dark:border-neutral-800"
            >
              <button
                type="button"
                onClick={() => toggleReveal(c.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="truncate">{c.question}</span>
                </div>
                {revealed.has(c.id) ? (
                  <p className="mt-0.5 whitespace-pre-wrap text-neutral-500">{c.answer}</p>
                ) : (
                  <p className="mt-0.5 text-neutral-400 italic">Tap to reveal answer</p>
                )}
              </button>
              <IconButton
                icon={Trash2}
                label="Delete flashcard"
                variant="danger"
                onClick={() => deleteFlashcard.mutate(c.id)}
              />
            </div>
          ))}
        </div>

        {createFlashcard.error && <div className="mb-2"><ErrorBanner message={createFlashcard.error.message} /></div>}
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <Textarea
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full"
            rows={2}
          />
          <Textarea
            placeholder="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full"
            rows={2}
          />
          <Button type="submit" variant="primary" size="sm" disabled={createFlashcard.isPending}>
            Add flashcard
          </Button>
        </form>
      </div>
    </div>
  );
}

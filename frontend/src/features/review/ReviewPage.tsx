import { useState } from "react";
import { CheckCircle2, Eye, RotateCcw } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Button } from "../../components/ui/Button";
import { useCompleteReview, useDueReviews } from "../../hooks/useReviews";
import type { DueReviewItem, ReviewOutcome } from "../../api/reviews";

const OUTCOMES: { value: ReviewOutcome; label: string; className: string }[] = [
  { value: "again", label: "Again", className: "bg-red-600 hover:bg-red-700" },
  { value: "good", label: "Good", className: "bg-accent-600 hover:bg-accent-700" },
  { value: "easy", label: "Easy", className: "bg-emerald-600 hover:bg-emerald-700" },
];

function ReviewCard({
  item,
  onComplete,
  isPending,
}: {
  item: DueReviewItem;
  onComplete: (outcome: ReviewOutcome) => void;
  isPending: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const hasAnswer = Boolean(item.topic_notes) || item.resources.length > 0;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <RotateCcw className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
          <div>
            <p className="font-medium">{item.topic_name}</p>
            <p className="text-sm text-neutral-500">
              {item.subject_name} · was due {item.next_review_date} · reviewed {item.review_count}x
            </p>
          </div>
        </div>
        {!revealed && (
          <Button type="button" variant="secondary" size="sm" icon={Eye} onClick={() => setRevealed(true)}>
            Reveal
          </Button>
        )}
      </div>

      {revealed && (
        <div className="space-y-2 rounded-md bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
          {!hasAnswer && <p className="text-neutral-500">No notes or resources saved for this topic.</p>}
          {item.topic_notes && <p className="whitespace-pre-wrap">{item.topic_notes}</p>}
          {item.resources.length > 0 && (
            <ul className="space-y-1">
              {item.resources.map((r) => (
                <li key={r.id}>
                  {r.type === "link" ? (
                    <a href={r.url ?? undefined} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline dark:text-accent-400">
                      {r.title}
                    </a>
                  ) : (
                    <>
                      <span className="font-medium">{r.title}: </span>
                      <span className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{r.content}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {revealed && (
        <div className="flex gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${o.className}`}
              disabled={isPending}
              onClick={() => onComplete(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ReviewPage() {
  const { data: dueReviews, isLoading, isError, error, refetch } = useDueReviews();
  const completeReview = useCompleteReview();

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        Topics you've marked done come back here for review. Reveal your notes to recall the answer first, then
        rate yourself — longer gaps follow each time you remember well.
      </p>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && dueReviews?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
          Nothing due for review right now.
        </div>
      )}

      <div className="space-y-2">
        {dueReviews?.map((item) => (
          <ReviewCard
            key={item.topic_id}
            item={item}
            isPending={completeReview.isPending}
            onComplete={(outcome) => completeReview.mutate({ topicId: item.topic_id, outcome })}
          />
        ))}
      </div>
    </div>
  );
}

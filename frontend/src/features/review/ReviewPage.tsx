import { CheckCircle2, RotateCcw } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useCompleteReview, useDueReviews } from "../../hooks/useReviews";
import type { ReviewOutcome } from "../../api/reviews";

const OUTCOMES: { value: ReviewOutcome; label: string; className: string }[] = [
  { value: "again", label: "Again", className: "bg-red-600 hover:bg-red-700" },
  { value: "good", label: "Good", className: "bg-blue-600 hover:bg-blue-700" },
  { value: "easy", label: "Easy", className: "bg-emerald-600 hover:bg-emerald-700" },
];

export function ReviewPage() {
  const { data: dueReviews, isLoading, isError, error, refetch } = useDueReviews();
  const completeReview = useCompleteReview();

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        Topics you've marked done come back here for review, with longer gaps each time you remember well.
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
          <Card key={item.topic_id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <RotateCcw className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
              <div>
                <p className="font-medium">{item.topic_name}</p>
                <p className="text-sm text-neutral-500">
                  {item.subject_name} · was due {item.next_review_date} · reviewed {item.review_count}x
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${o.className}`}
                  disabled={completeReview.isPending}
                  onClick={() => completeReview.mutate({ topicId: item.topic_id, outcome: o.value })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

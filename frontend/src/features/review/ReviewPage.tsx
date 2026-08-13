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
      <div>
        <h1 className="text-xl font-semibold">Review queue</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Topics you've marked done come back here for review, with longer gaps each time you remember well.
        </p>
      </div>

      {isError && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && !isError && dueReviews?.length === 0 && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Nothing due for review right now.</p>
      )}

      <div className="space-y-2">
        {dueReviews?.map((item) => (
          <Card key={item.topic_id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.topic_name}</p>
              <p className="text-sm text-neutral-500">
                {item.subject_name} · was due {item.next_review_date} · reviewed {item.review_count}x
              </p>
            </div>
            <div className="flex gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  className={`rounded px-3 py-1.5 text-sm font-medium text-white ${o.className}`}
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

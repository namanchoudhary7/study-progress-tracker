import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi, type ReviewOutcome } from "../api/reviews";

export const dueReviewsKey = ["reviews", "due"] as const;

export function useDueReviews() {
  return useQuery({ queryKey: dueReviewsKey, queryFn: reviewsApi.due });
}

export function useCompleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, outcome }: { topicId: number; outcome: ReviewOutcome }) =>
      reviewsApi.complete(topicId, outcome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dueReviewsKey });
      qc.invalidateQueries({ queryKey: ["stats", "overdue"] });
    },
  });
}

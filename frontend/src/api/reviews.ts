import { api } from "../lib/apiClient";

export interface DueReviewItem {
  topic_id: number;
  topic_name: string;
  subject_id: number;
  subject_name: string;
  next_review_date: string;
  interval_days: number;
  review_count: number;
}

export type ReviewOutcome = "again" | "good" | "easy";

export const reviewsApi = {
  due: () => api.get<DueReviewItem[]>("/reviews/due"),
  complete: (topicId: number, outcome: ReviewOutcome) =>
    api.post(`/reviews/${topicId}/complete`, { outcome }),
};

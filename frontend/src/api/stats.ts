import { api } from "../lib/apiClient";

export interface OverviewStats {
  total_subjects: number;
  total_topics: number;
  topics_done: number;
  completion_pct: number;
  total_minutes: number;
}

export interface CompletionItem {
  subject_id: number;
  subject_name: string;
  subject_color: string | null;
  total_topics: number;
  done_topics: number;
  completion_pct: number;
}

export interface TimeSpentPoint {
  label: string;
  minutes: number;
}

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
}

export interface OverdueGoal {
  id: number;
  title: string;
  target_date: string;
}

export interface OverdueSummary {
  overdue_goals: OverdueGoal[];
  due_reviews_count: number;
}

export const statsApi = {
  overview: () => api.get<OverviewStats>("/stats/overview"),
  completion: () => api.get<CompletionItem[]>("/stats/completion"),
  timeSpent: (groupBy: "day" | "week" | "subject" = "day") =>
    api.get<TimeSpentPoint[]>(`/stats/time-spent?group_by=${groupBy}`),
  streaks: () => api.get<StreakStats>("/stats/streaks"),
  overdue: () => api.get<OverdueSummary>("/stats/overdue"),
};

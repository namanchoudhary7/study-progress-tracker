import { useQuery } from "@tanstack/react-query";
import { statsApi } from "../api/stats";

export function useOverviewStats() {
  return useQuery({ queryKey: ["stats", "overview"], queryFn: statsApi.overview });
}

export function useCompletionStats() {
  return useQuery({ queryKey: ["stats", "completion"], queryFn: statsApi.completion });
}

export function useTimeSpentStats(groupBy: "day" | "week" | "subject" = "day") {
  return useQuery({ queryKey: ["stats", "time-spent", groupBy], queryFn: () => statsApi.timeSpent(groupBy) });
}

export function useStreakStats() {
  return useQuery({ queryKey: ["stats", "streaks"], queryFn: statsApi.streaks });
}

export function useOverdueStats() {
  return useQuery({ queryKey: ["stats", "overdue"], queryFn: statsApi.overdue });
}

export function useHeatmapStats(year?: number) {
  return useQuery({ queryKey: ["stats", "heatmap", year ?? "current"], queryFn: () => statsApi.heatmap(year) });
}

export function useHeatmapYears() {
  return useQuery({ queryKey: ["stats", "heatmap", "years"], queryFn: statsApi.heatmapYears });
}

export function useBadges() {
  return useQuery({ queryKey: ["stats", "badges"], queryFn: statsApi.badges });
}

import { api } from "../lib/apiClient";
import type { Badge as BadgeType, OverviewStats, StreakStats } from "./stats";

export interface PublicProfile {
  username: string;
  display_name: string | null;
  overview: OverviewStats;
  streaks: StreakStats;
  badges: BadgeType[];
}

export const publicApi = {
  profile: (shareToken: string) => api.get<PublicProfile>(`/public/${shareToken}`),
};

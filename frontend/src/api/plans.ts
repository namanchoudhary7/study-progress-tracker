import { api } from "../lib/apiClient";
import type { RecurringPlan, TodayPlanItem } from "./types";

export const plansApi = {
  list: () => api.get<RecurringPlan[]>("/plans"),
  today: () => api.get<TodayPlanItem[]>("/plans/today"),
  create: (data: { subject_id: number; topic_id?: number | null; days_of_week: number }) =>
    api.post<RecurringPlan>("/plans", data),
  update: (id: number, data: Partial<RecurringPlan>) => api.patch<RecurringPlan>(`/plans/${id}`, data),
  remove: (id: number) => api.delete(`/plans/${id}`),
};

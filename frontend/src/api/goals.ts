import { api } from "../lib/apiClient";
import type { Goal } from "./types";

export const goalsApi = {
  list: (params?: { status?: string; overdue?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.overdue) query.set("overdue", "true");
    const qs = query.toString();
    return api.get<Goal[]>(`/goals${qs ? `?${qs}` : ""}`);
  },
  create: (data: Partial<Goal> & { title: string; target_date: string }) =>
    api.post<Goal>("/goals", data),
  update: (id: number, data: Partial<Goal>) => api.patch<Goal>(`/goals/${id}`, data),
  remove: (id: number) => api.delete(`/goals/${id}`),
};

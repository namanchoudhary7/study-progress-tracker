import { api } from "../lib/apiClient";
import type { StudySession } from "./types";

export const sessionsApi = {
  list: () => api.get<StudySession[]>("/sessions"),
  create: (data: Partial<StudySession> & { subject_id: number; session_date: string; duration_minutes: number }) =>
    api.post<StudySession>("/sessions", data),
  update: (id: number, data: Partial<StudySession>) => api.patch<StudySession>(`/sessions/${id}`, data),
  remove: (id: number) => api.delete(`/sessions/${id}`),
};

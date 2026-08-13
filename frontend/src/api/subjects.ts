import { api } from "../lib/apiClient";
import type { Subject } from "./types";

export const subjectsApi = {
  list: () => api.get<Subject[]>("/subjects"),
  get: (id: number) => api.get<Subject>(`/subjects/${id}`),
  create: (data: Partial<Subject>) => api.post<Subject>("/subjects", data),
  update: (id: number, data: Partial<Subject>) => api.patch<Subject>(`/subjects/${id}`, data),
  remove: (id: number) => api.delete(`/subjects/${id}`),
};

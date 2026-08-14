import { api } from "../lib/apiClient";
import type { Tag } from "./types";

export const tagsApi = {
  list: () => api.get<Tag[]>("/tags"),
  create: (data: { name: string; color?: string | null }) => api.post<Tag>("/tags", data),
  update: (id: number, data: { name?: string; color?: string | null }) => api.patch<Tag>(`/tags/${id}`, data),
  remove: (id: number) => api.delete(`/tags/${id}`),
};

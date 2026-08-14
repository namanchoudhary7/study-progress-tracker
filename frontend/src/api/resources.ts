import { api } from "../lib/apiClient";
import type { Resource, ResourceType } from "./types";

export const resourcesApi = {
  list: (topicId: number) => api.get<Resource[]>(`/topics/${topicId}/resources`),
  create: (topicId: number, data: { type: ResourceType; title: string; url?: string | null; content?: string | null }) =>
    api.post<Resource>(`/topics/${topicId}/resources`, data),
  update: (id: number, data: { title?: string; url?: string | null; content?: string | null }) =>
    api.patch<Resource>(`/resources/${id}`, data),
  remove: (id: number) => api.delete(`/resources/${id}`),
};

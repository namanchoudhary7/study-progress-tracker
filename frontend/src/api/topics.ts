import { api } from "../lib/apiClient";
import type { Topic } from "./types";

type TopicWrite = Partial<Omit<Topic, "tags">> & { tag_ids?: number[] };

export const topicsApi = {
  list: (subjectId?: number) =>
    api.get<Topic[]>(subjectId ? `/topics?subject_id=${subjectId}` : "/topics"),
  get: (id: number) => api.get<Topic>(`/topics/${id}`),
  create: (data: TopicWrite & { subject_id: number; name: string }) =>
    api.post<Topic>("/topics", data),
  bulkCreate: (subjectId: number, text: string) =>
    api.post<Topic[]>("/topics/bulk", { subject_id: subjectId, text }),
  update: (id: number, data: TopicWrite) => api.patch<Topic>(`/topics/${id}`, data),
  remove: (id: number) => api.delete(`/topics/${id}`),
};

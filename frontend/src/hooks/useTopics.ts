import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { topicsApi } from "../api/topics";
import type { Topic } from "../api/types";

export function topicsKey(subjectId?: number) {
  return ["topics", subjectId ?? "all"] as const;
}

export function useTopics(subjectId?: number) {
  return useQuery({ queryKey: topicsKey(subjectId), queryFn: () => topicsApi.list(subjectId) });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Topic> & { subject_id: number; name: string }) => topicsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Topic> }) => topicsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useBulkCreateTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, text }: { subjectId: number; text: string }) => topicsApi.bulkCreate(subjectId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => topicsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

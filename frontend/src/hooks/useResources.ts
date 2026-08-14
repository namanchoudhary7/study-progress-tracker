import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resourcesApi } from "../api/resources";
import type { ResourceType } from "../api/types";

export function resourcesKey(topicId: number) {
  return ["resources", topicId] as const;
}

export function useResources(topicId: number) {
  return useQuery({ queryKey: resourcesKey(topicId), queryFn: () => resourcesApi.list(topicId) });
}

export function useCreateResource(topicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: ResourceType; title: string; url?: string | null; content?: string | null }) =>
      resourcesApi.create(topicId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: resourcesKey(topicId) }),
  });
}

export function useDeleteResource(topicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resourcesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: resourcesKey(topicId) }),
  });
}

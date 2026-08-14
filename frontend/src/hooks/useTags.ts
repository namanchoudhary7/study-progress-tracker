import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "../api/tags";

export const tagsKey = ["tags"] as const;

export function useTags() {
  return useQuery({ queryKey: tagsKey, queryFn: tagsApi.list });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string | null }) => tagsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsKey }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string | null } }) =>
      tagsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsKey }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagsKey });
      qc.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}

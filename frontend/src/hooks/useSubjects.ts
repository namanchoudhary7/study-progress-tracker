import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "../api/subjects";
import type { Subject } from "../api/types";

export const subjectsKey = ["subjects"] as const;

export function useSubjects() {
  return useQuery({ queryKey: subjectsKey, queryFn: subjectsApi.list });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Subject>) => subjectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectsKey }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subject> }) => subjectsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectsKey }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subjectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectsKey }),
  });
}

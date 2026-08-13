import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "../api/goals";
import type { Goal } from "../api/types";

export function goalsKey(params?: { status?: string; overdue?: boolean }) {
  return ["goals", params ?? {}] as const;
}

export function useGoals(params?: { status?: string; overdue?: boolean }) {
  return useQuery({ queryKey: goalsKey(params), queryFn: () => goalsApi.list(params) });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal> & { title: string; target_date: string }) => goalsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Goal> }) => goalsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => goalsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

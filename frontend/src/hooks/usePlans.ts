import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "../api/plans";
import type { RecurringPlan } from "../api/types";

export const plansKey = ["plans"] as const;
export const todayPlansKey = ["plans", "today"] as const;

export function usePlans() {
  return useQuery({ queryKey: plansKey, queryFn: plansApi.list });
}

export function useTodayPlans() {
  return useQuery({ queryKey: todayPlansKey, queryFn: plansApi.today });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject_id: number; topic_id?: number | null; days_of_week: number }) =>
      plansApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey });
      qc.invalidateQueries({ queryKey: todayPlansKey });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RecurringPlan> }) => plansApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey });
      qc.invalidateQueries({ queryKey: todayPlansKey });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plansApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey });
      qc.invalidateQueries({ queryKey: todayPlansKey });
    },
  });
}

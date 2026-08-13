import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions";
import type { StudySession } from "../api/types";

export const sessionsKey = ["sessions"] as const;

export function useSessions() {
  return useQuery({ queryKey: sessionsKey, queryFn: sessionsApi.list });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StudySession> & { subject_id: number; session_date: string; duration_minutes: number }) =>
      sessionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKey });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sessionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKey });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

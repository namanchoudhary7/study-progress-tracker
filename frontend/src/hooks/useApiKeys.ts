import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeysApi } from "../api/apiKeys";

const API_KEYS_KEY = ["api-keys"];

export function useApiKeys() {
  return useQuery({ queryKey: API_KEYS_KEY, queryFn: apiKeysApi.list });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiKeysApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: API_KEYS_KEY }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiKeysApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: API_KEYS_KEY }),
  });
}

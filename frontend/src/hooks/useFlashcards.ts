import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flashcardsApi } from "../api/flashcards";

export function flashcardsKey(topicId: number) {
  return ["flashcards", topicId] as const;
}

export function useFlashcards(topicId: number) {
  return useQuery({ queryKey: flashcardsKey(topicId), queryFn: () => flashcardsApi.list(topicId) });
}

export function useCreateFlashcard(topicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { question: string; answer: string }) => flashcardsApi.create(topicId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: flashcardsKey(topicId) }),
  });
}

export function useDeleteFlashcard(topicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => flashcardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: flashcardsKey(topicId) }),
  });
}

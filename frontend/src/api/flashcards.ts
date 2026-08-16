import { api } from "../lib/apiClient";
import type { Flashcard } from "./types";

export const flashcardsApi = {
  list: (topicId: number) => api.get<Flashcard[]>(`/topics/${topicId}/flashcards`),
  create: (topicId: number, data: { question: string; answer: string }) =>
    api.post<Flashcard>(`/topics/${topicId}/flashcards`, data),
  update: (id: number, data: { question?: string; answer?: string }) =>
    api.patch<Flashcard>(`/flashcards/${id}`, data),
  remove: (id: number) => api.delete(`/flashcards/${id}`),
};

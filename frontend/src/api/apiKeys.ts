import { api } from "../lib/apiClient";
import type { ApiKey, ApiKeyCreated } from "./types";

export const apiKeysApi = {
  list: () => api.get<ApiKey[]>("/api-keys"),
  create: (name: string) => api.post<ApiKeyCreated>("/api-keys", { name }),
  remove: (id: number) => api.delete(`/api-keys/${id}`),
};

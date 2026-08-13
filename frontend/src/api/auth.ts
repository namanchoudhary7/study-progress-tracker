import { api } from "../lib/apiClient";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  created_at: string;
  csrf_token: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const authApi = {
  me: () => api.get<AuthUser>("/auth/me"),
  signup: (email: string, username: string, password: string) =>
    api.post<AuthUser>("/auth/signup", { email, username, password }),
  login: (email: string, password: string) => api.post<AuthUser>("/auth/login", { email, password }),
  logout: () => api.post<void>("/auth/logout", {}),
  googleLoginUrl: `${API_URL}/auth/google/login`,
};

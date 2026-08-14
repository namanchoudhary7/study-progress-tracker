import { api } from "../lib/apiClient";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  created_at: string;
  email_verified: boolean;
  has_password: boolean;
  share_token: string | null;
  digest_frequency: "off" | "weekly" | "monthly";
  csrf_token: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const authApi = {
  me: () => api.get<AuthUser>("/auth/me"),
  signup: (email: string, username: string, password: string) =>
    api.post<AuthUser>("/auth/signup", { email, username, password }),
  login: (identifier: string, password: string) => api.post<AuthUser>("/auth/login", { identifier, password }),
  logout: () => api.post<void>("/auth/logout", {}),
  verifyEmail: (token: string) => api.post<void>("/auth/verify-email", { token }),
  resendVerification: () => api.post<void>("/auth/resend-verification", {}),
  googleLoginUrl: `${API_URL}/auth/google/login`,
};

import { api } from "../lib/apiClient";

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  created_at: string;
  email_verified: boolean;
  has_password: boolean;
  share_token: string | null;
}

export interface ProfileUpdate {
  display_name?: string | null;
  username?: string;
  email?: string;
}

export const usersApi = {
  updateMe: (data: ProfileUpdate) => api.patch<UserProfile>("/users/me", data),
  changePassword: (current_password: string, new_password: string) =>
    api.post<void>("/users/me/password", { current_password, new_password }),
  deleteMe: (data: { password?: string; confirmation?: string }) => api.delete<void>("/users/me", data),
  createShareLink: () => api.post<UserProfile>("/users/me/share-link", {}),
  revokeShareLink: () => api.delete<UserProfile>("/users/me/share-link"),
};

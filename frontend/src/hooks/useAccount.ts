import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type ProfileUpdate } from "../api/users";
import { ME_KEY } from "../context/AuthContext";
import type { AuthUser } from "../api/auth";
import { setCsrfToken } from "../lib/csrfToken";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) => usersApi.updateMe(data),
    onSuccess: (profile) => {
      qc.setQueryData<AuthUser>(ME_KEY, (old) => (old ? { ...old, ...profile } : old));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(currentPassword, newPassword),
  });
}

export function useCreateShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.createShareLink(),
    onSuccess: (profile) => {
      qc.setQueryData<AuthUser>(ME_KEY, (old) => (old ? { ...old, ...profile } : old));
    },
  });
}

export function useRevokeShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.revokeShareLink(),
    onSuccess: (profile) => {
      qc.setQueryData<AuthUser>(ME_KEY, (old) => (old ? { ...old, ...profile } : old));
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { password?: string; confirmation?: string }) => usersApi.deleteMe(data),
    onSuccess: () => {
      setCsrfToken(null);
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}

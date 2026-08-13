import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "../api/auth";

interface AuthContextValue {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  loginError: string | null;
  signupError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_KEY = ["auth", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const meQuery = useQuery({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });

  const signupMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.signup(email, password),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });

  const value: AuthContextValue = {
    user: meQuery.data ?? (meQuery.isError ? null : undefined),
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: (email, password) => loginMutation.mutateAsync({ email, password }),
    signup: (email, password) => signupMutation.mutateAsync({ email, password }),
    logout: () => logoutMutation.mutateAsync(),
    loginError: loginMutation.error ? loginMutation.error.message : null,
    signupError: signupMutation.error ? signupMutation.error.message : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

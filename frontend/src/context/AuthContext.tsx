import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "../api/auth";
import { setCsrfToken } from "../lib/csrfToken";

interface AuthContextValue {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  signup: (email: string, username: string, password: string) => Promise<AuthUser>;
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

  useEffect(() => {
    setCsrfToken(meQuery.data?.csrf_token ?? null);
  }, [meQuery.data]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        qc.invalidateQueries({ queryKey: ME_KEY });
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [qc]);

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      authApi.login(identifier, password),
    onSuccess: (user) => {
      setCsrfToken(user.csrf_token);
      qc.setQueryData(ME_KEY, user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: ({ email, username, password }: { email: string; username: string; password: string }) =>
      authApi.signup(email, username, password),
    onSuccess: (user) => {
      setCsrfToken(user.csrf_token);
      qc.setQueryData(ME_KEY, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setCsrfToken(null);
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });

  const value: AuthContextValue = {
    user: meQuery.data ?? (meQuery.isError ? null : undefined),
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: (identifier, password) => loginMutation.mutateAsync({ identifier, password }),
    signup: (email, username, password) => signupMutation.mutateAsync({ email, username, password }),
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

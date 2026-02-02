import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/apiFetch";
import { setToken, clearToken } from "@/lib/authToken";

export function useAuth() {
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      try {
        const user = await apiFetch<User>(api.auth.me.path);
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Pick<InsertUser, "username" | "password">) => {
      const response = await apiFetch<{ user: User; token: string }>(api.auth.login.path, {
        method: api.auth.login.method,
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: ({ user, token }) => {
      setToken(token);
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "Welcome back", description: "Successfully logged in", duration: 2000 });
      if (user.role === "coach") setLocation("/dashboard");
      else setLocation("/athlete/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiFetch<{ user: User; token: string }>(api.auth.register.path, {
        method: api.auth.register.method,
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: ({ user, token }) => {
      setToken(token);
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "Account created", description: "Welcome to MetaLifts" });
      if (user.role === "coach") setLocation("/dashboard");
      else setLocation("/athlete/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Best effort network logout, but primarily local
      try {
        await apiFetch(api.auth.logout.path, { method: api.auth.logout.method });
      } catch (e) {
        // ignore error
      }
    },
    onSuccess: () => {
      clearToken();
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/");
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
  };
}

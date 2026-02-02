import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

export function useAthletes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: athletes, isLoading } = useQuery({
    queryKey: [api.athletes.list.path],
    queryFn: async () => {
      return await apiFetch<User[]>(api.athletes.list.path);
    },
  });

  const createAthlete = useMutation({
    mutationFn: async (data: InsertUser) => {
      console.log(`Attempting to create athlete: ${data.username}`);
      return await apiFetch<User>(api.athletes.create.path, {
        method: api.athletes.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.athletes.list.path] });
      toast({ title: "Success", description: "Athlete added successfully" });
    },
    onError: (error: Error) => {
      console.error("Mutation error (createAthlete):", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<User>) => {
      return await apiFetch<User>(api.athletes.update.path.replace(":id", String(id)), {
        method: api.athletes.update.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.athletes.list.path] });
      toast({ title: "Saved", description: "Plan links updated" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return { athletes, isLoading, createAthlete, updateAthlete };
}

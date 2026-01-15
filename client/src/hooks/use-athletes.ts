import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type User } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAthletes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: athletes, isLoading } = useQuery({
    queryKey: [api.athletes.list.path],
    queryFn: async () => {
      const res = await fetch(api.athletes.list.path);
      if (!res.ok) throw new Error("Failed to fetch athletes");
      return await res.json() as User[];
    },
  });

  const createAthlete = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.athletes.create.path, {
        method: api.athletes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return await res.json() as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.athletes.list.path] });
      toast({ title: "Success", description: "Athlete added successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<User>) => {
      const res = await fetch(api.athletes.update.path.replace(":id", String(id)), {
        method: api.athletes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Update failed");
      }
      return await res.json() as User;
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
